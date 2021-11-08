declare const Papa: {
    parse: typeof CsvToJson;
    unparse: typeof JsonToCsv;
    RECORD_SEP: string;
    UNIT_SEP: string;
    BYTE_ORDER_MARK: string;
    BAD_DELIMITERS: any[];
    WORKERS_SUPPORTED: boolean;
    NODE_STREAM_INPUT: number;
    LocalChunkSize: number;
    RemoteChunkSize: number;
    DefaultDelimiter: string;
    Parser: typeof Parser;
    ParserHandle: typeof ParserHandle;
    ChunkStreamer: typeof ChunkStreamer;
    StringStreamer: typeof StringStreamer;
};
export default Papa;
declare function CsvToJson(_input: any, _config: any, UserDefinedStreamer?: any): any;
declare function JsonToCsv(_input: any, _config: any): string;
/** ChunkStreamer is the base prototype for various streamer implementations. */
declare function ChunkStreamer(config: any): void;
declare function StringStreamer(config: any): void;
declare namespace StringStreamer {
    var prototype: any;
}
declare function ParserHandle(_config: any): void;
/** The core parser implements speedy and correct CSV parsing */
declare function Parser(config: any): void;
