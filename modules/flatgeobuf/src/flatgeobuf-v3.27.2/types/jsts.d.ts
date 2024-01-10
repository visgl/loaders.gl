declare module 'jsts/org/locationtech/jts/io/GeoJSONWriter.js' {
    export default class GeoJSONWriter {
      write(geometry: any): any;
    }
}

declare module 'jsts/org/locationtech/jts/io/WKTReader.js' {
    export default class WKTReader {
      read(): any;
    }
}

declare module 'jsts/org/locationtech/jts/geom/Envelope.js' {
    export default class Envelope {
      constructor(minx: number, maxx: number, miny: number, maxy: number);
    }
}

declare module 'jsts/org/locationtech/jts/geom/GeometryFactory.js' {
    export default class GeometryFactory {
      toGeometry(e: any): any;
    }
}
