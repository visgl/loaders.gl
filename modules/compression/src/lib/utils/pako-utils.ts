// TODO - For some reason we don't get the error message from pako in _onEnd?
export function getPakoError(code: number = 0): string {
  const MESSAGES = {
    /* Z_NEED_DICT       2  */
    2: 'need dictionary',
    /* Z_STREAM_END      1  */
    1: 'stream end',
    /* Z_OK              0  */
    0: '',
    /* Z_ERRNO         (-1) */
    '-1': 'file error',
    /* Z_STREAM_ERROR  (-2) */
    '-2': 'stream error',
    /* Z_DATA_ERROR    (-3) */
    '-3': 'data error',
    /* Z_MEM_ERROR     (-4) */
    '-4': 'insufficient memory',
    /* Z_BUF_ERROR     (-5) */
    '-5': 'buffer error',
    /* Z_VERSION_ERROR (-6) */
    '-6': 'incompatible version'
  };
  return MESSAGES[code] || 'unknown Pako library error';
}
