/* SPDX-License-Identifier: MIT
 * Copyright (c) 2018 Jack Andersen
 * LZO1X decoder adapted from AxioDL/lzokay, revision
 * db2df1fcbebc2ed06c10f727f72567d40f06a2be (see LICENSE and PROVENANCE.md).
 * Offset arithmetic replaces speculative pointers; all accesses are checked.
 * NULL output selects a validating, bounded size probe without allocation.
 */
#include "algorithm_registry.h"
#include <stdint.h>
#include <string.h>

/* Decode or validate/count one raw LZO1X block. No container framing. */
static cu_status_t lzo_decode(const uint8_t* input, size_t length,
                              uint8_t* output, size_t capacity, size_t* produced) {
    size_t input_offset = 0, output_offset = 0, state = 0;
    size_t match_length = 0, distance = 0, next_state = 0;
    *produced = 0;
#define NEED_INPUT(count) do { if ((count) > length - input_offset) { \
    cu_set_last_error("truncated LZO1X input"); return CU_ERR_TRUNCATED; } } while (0)
#define NEED_OUTPUT(count) do { if ((count) > capacity - output_offset) { \
    cu_set_last_error("LZO1X output exceeds capacity"); return CU_ERR_BUF_TOO_SMALL; } } while (0)
#define COPY_LITERALS(count) do { size_t copy_count = (count); \
    NEED_INPUT(copy_count); NEED_OUTPUT(copy_count); \
    if (output && copy_count) memcpy(output + output_offset, input + input_offset, copy_count); \
    input_offset += copy_count; output_offset += copy_count; } while (0)
#define EXTEND_LENGTH(base, result) do { size_t extended = (base); \
    for (;;) { NEED_INPUT(1); uint8_t byte = input[input_offset++]; \
        size_t increment = byte ? byte : 255; \
        if (extended > SIZE_MAX - increment) return CU_ERR_SIZE_LIMIT; \
        extended += increment; if (byte) break; } (result) = extended; } while (0)
    NEED_INPUT(1);
    if (input[0] > 17) {
        size_t literal_count = input[input_offset++] - 17;
        COPY_LITERALS(literal_count);
        state = literal_count < 4 ? literal_count : 4;
    }
    for (;;) {
        NEED_INPUT(1);
        uint8_t instruction = input[input_offset++];
        if (instruction >= 64) {
            NEED_INPUT(1);
            distance = ((size_t)input[input_offset++] << 3) + ((instruction >> 2) & 7) + 1;
            match_length = (instruction >> 5) + 1;
            next_state = instruction & 3;
        } else if (instruction >= 32) {
            match_length = (instruction & 31) + 2;
            if (match_length == 2) EXTEND_LENGTH(33, match_length);
            NEED_INPUT(2);
            size_t word = input[input_offset] | ((size_t)input[input_offset + 1] << 8);
            input_offset += 2;
            distance = (word >> 2) + 1;
            next_state = word & 3;
        } else if (instruction >= 16) {
            match_length = (instruction & 7) + 2;
            if (match_length == 2) EXTEND_LENGTH(9, match_length);
            NEED_INPUT(2);
            size_t word = input[input_offset] | ((size_t)input[input_offset + 1] << 8);
            input_offset += 2;
            distance = ((size_t)(instruction & 8) << 11) + (word >> 2);
            next_state = word & 3;
            if (distance == 0) {
                if (match_length != 3 || input_offset != length) {
                    cu_set_last_error("invalid LZO1X end marker or trailing input");
                    return CU_ERR_DECOMPRESSION;
                }
                *produced = output_offset;
                return CU_OK;
            }
            distance += 16384;
        } else if (state == 0) {
            size_t literal_count = instruction + 3;
            if (literal_count == 3) EXTEND_LENGTH(18, literal_count);
            COPY_LITERALS(literal_count);
            state = 4;
            continue;
        } else {
            NEED_INPUT(1);
            distance = (instruction >> 2) + ((size_t)input[input_offset++] << 2)
                     + (state == 4 ? 2049 : 1);
            match_length = state == 4 ? 3 : 2;
            next_state = instruction & 3;
        }
        if (distance > output_offset) {
            cu_set_last_error("invalid LZO1X back-reference");
            return CU_ERR_DECOMPRESSION;
        }
        NEED_OUTPUT(match_length);
        if (output) {
            /* Forward copying intentionally permits overlapping matches. */
            for (size_t index = 0; index < match_length; index++)
                output[output_offset + index] = output[output_offset + index - distance];
        }
        output_offset += match_length;
        COPY_LITERALS(next_state);
        state = next_state;
    }
#undef NEED_INPUT
#undef NEED_OUTPUT
#undef COPY_LITERALS
#undef EXTEND_LENGTH
}

static cu_status_t lzo_decompress(const uint8_t* input, size_t length,
                                  uint8_t* output, size_t* output_length) {
    size_t limit = cu_get_max_decompressed_size();
    size_t capacity = *output_length;
    if (limit && capacity > limit) capacity = limit;
    size_t produced = 0;
    cu_status_t status = lzo_decode(input, length, output, capacity, &produced);
    if (status == CU_ERR_BUF_TOO_SMALL && limit && *output_length >= limit)
        status = CU_ERR_SIZE_LIMIT;
    if (status == CU_OK) *output_length = produced;
    return status;
}
static cu_status_t lzo_size_hint(const uint8_t* input, size_t length, size_t* output_size) {
    size_t limit = cu_get_max_decompressed_size();
    cu_status_t status = lzo_decode(input, length, NULL, limit ? limit : SIZE_MAX, output_size);
    return status == CU_ERR_BUF_TOO_SMALL ? CU_ERR_SIZE_LIMIT : status;
}
const cu_algorithm_vtbl_t cu_lzo_vtbl = {
    .name = "lzo",
    .decompress = lzo_decompress,
    .decompress_size_hint = lzo_size_hint,
};
