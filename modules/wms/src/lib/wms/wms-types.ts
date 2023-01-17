// loaders.gl, MIT licenses

/** All capabilities of a WMS service - response to a WMS `GetCapabilities` data structure extracted from XML */
export type WMSCapabilities = {
  name: string;
  title?: string;
  abstract?: string;
  keywords: string[];
  layer: {
    name: string;
    title?: string;
    srs?: string[];
    boundingBox?: [number, number, number, number];
    layers: WMSLayer[];
  };
  requests: Record<string, WMSRequest>;
  raw: Record<string, unknown>;
};

export type WMSLayer = {
  name: string;
  title?: string;
  srs?: string[];
  boundingBox?: [number, number, number, number];
  layers: WMSLayer[];
};

export type WMSRequest = {
  name: string;
  mimeTypes: string[];
};

// GetFeatureInfo

/** WMS Feature info - response to a WMS `GetFeatureInfo` request */
export type WMSFeatureInfo = {
  features: WMSFeature[];
};

export type WMSFeature = {
  attributes: Record<string, number | string>;
  type: string;
  bounds: {top: number; bottom: number; left: number; right: number};
};

// DescribeLayer

/** Layer description - response to a WMS `DescribeLayer` request  */
export type WMSLayerDescription = {
  layers: {}[];
};

// // WIP

// export type GetCapabilities = {
//   request: 'GetCapabilities';
//   format: string[];
//   dcpType: unknown;
// };

// export type GetMap = {
//   request: 'GetMap';
//   format: string[];
//   dcpType: unknown;
// };

// export type GetFeatureInfo = {
//   request: 'GetFeatureInfo';
//   format: string[];
//   dcpType: unknown;
// };

// export type GetLegendGraphic = {
//   request: 'GetLegendGraphic';
//   format: string[];
//   dcpType: unknown;
// };

// export type GetStyles = {
//   request: 'GetStyles';
//   format: string[];
//   dcpType: unknown;
// };

/**
 * <EX_GeographicBoundingBox>
 *     <westBoundLongitude>-180</westBoundLongitude>
 *     <eastBoundLongitude>180</eastBoundLongitude>
 *     <southBoundLatitude>-65</southBoundLatitude>
 *     <northBoundLatitude>75</northBoundLatitude>
 * </EX_GeographicBoundingBox>
 * <BoundingBox CRS="EPSG:4326"
 *             minx="-65" miny="-180" maxx="75" maxy="180" />
 */
export type Layer = {
  name: string; // e.g. DMSP-Global-Composites-Version-4
  title: string; // e.g. DMSP-Global-Composites-Version-4</Title>
  abstract?: string; // DMSP-Global-Composites-Version-4</Abstract>
  crs: string; // e.g. EPSG:4326</CRS>
  queryable?: boolean;
  opaque?: boolean;
  cascaded?: boolean;
  geographicBoundingBox: number[];
  boundingBox: number[];
  boundingBoxCRS: string;
  layers: Layer[];
};

/**
 * <Style>
 * <Name>default</Name>
 * <Title>default</Title>
 * <LegendURL width="89" height="21">
 *    <Format>image/png</Format>
 *    <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?version=1.3.0&amp;service=WMS&amp;request=GetLegendGraphic&amp;sld_version=1.1.0&amp;layer=countries&amp;format=image/png&amp;STYLE=default"/>
 * </LegendURL>
 * </Style>
 */
export type Style = {
  name: string; // e.g. DMSP-Global-Composites-Version-4
  title: string; // e.g. DMSP-Global-Composites-Version-4</Title>
  legendUrl?: {
    width: number;
    height: number;
    format: string;
    onlineResource: string;
  };
};

// export type Capability = GetCapabilities | GetMap;

export type WMSService = {
  rawData: unknown;
  name: string;
  title: string;
  onlineResource?: string;
  contactInformation?: string;
  maxWidth?: number;
  maxHeight?: number;
  capabilities: {
    // getCapabilities: GetCapabilities;
    // getMap: GetMap;
    // getFeatureInfo?: GetFeatureInfo;
  };

  untypedData: unknown; // The raw, untyped JSON converted from XML
};

/* 
<Capability>
  <Request>
    <GetCapabilities>
      <Format>text/xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Post>
        </HTTP>
      </DCPType>
    </GetCapabilities>
    <GetMap>
      <Format>image/png</Format>
      <Format>image/tiff</Format>
      <Format>image/jpeg</Format>
      <Format>image/png; mode=8bit</Format>
      <Format>application/x-pdf</Format>
      <Format>image/svg+xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Post>
        </HTTP>
      </DCPType>
    </GetMap>
    <GetFeatureInfo>
      <Format>text/plain</Format>
      <Format>application/vnd.ogc.gml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Post>
        </HTTP>
      </DCPType>
    </GetFeatureInfo>
    <sld:DescribeLayer>
      <Format>text/xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Post>
        </HTTP>
      </DCPType>
    </sld:DescribeLayer>
    <sld:GetLegendGraphic>
      <Format>image/png</Format>
      <Format>image/jpeg</Format>
      <Format>image/png; mode=8bit</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Post>
        </HTTP>
      </DCPType>
    </sld:GetLegendGraphic>
    <ms:GetStyles>
      <Format>text/xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?"/></Post>
        </HTTP>
      </DCPType>
    </ms:GetStyles>
  </Request>
  <Exception>
    <Format>XML</Format>
    <Format>INIMAGE</Format>
    <Format>BLANK</Format>
  </Exception>
  <sld:UserDefinedSymbolization SupportSLD="1" UserLayer="0" UserStyle="1" RemoteWFS="0" InlineFeature="0" RemoteWCS="0"/>
  <Layer>
    <Name>DMSP-Global-Composites-Version-4</Name>
    <Title>DMSP-Global-Composites-Version-4</Title>
    <Abstract>DMSP-Global-Composites-Version-4</Abstract>
    <CRS>EPSG:4326</CRS>
    <EX_GeographicBoundingBox>
        <westBoundLongitude>-180</westBoundLongitude>
        <eastBoundLongitude>180</eastBoundLongitude>
        <southBoundLatitude>-65</southBoundLatitude>
        <northBoundLatitude>75</northBoundLatitude>
    </EX_GeographicBoundingBox>
    <BoundingBox CRS="EPSG:4326"
                minx="-65" miny="-180" maxx="75" maxy="180" />
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>countries</Name>
        <Title>Countries</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-90</southBoundLatitude>
            <northBoundLatitude>83.6236</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-90" miny="-180" maxx="83.6236" maxy="180" />
        <Style>
          <Name>default</Name>
          <Title>default</Title>
          <LegendURL width="89" height="21">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?version=1.3.0&amp;service=WMS&amp;request=GetLegendGraphic&amp;sld_version=1.1.0&amp;layer=countries&amp;format=image/png&amp;STYLE=default"/>
          </LegendURL>
        </Style>
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>adminboundaries</Name>
        <Title>Administrative Boundaries</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-90</southBoundLatitude>
            <northBoundLatitude>83.6236</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-90" miny="-180" maxx="83.6236" maxy="180" />
        <Style>
          <Name>default</Name>
          <Title>default</Title>
          <LegendURL width="65" height="21">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?version=1.3.0&amp;service=WMS&amp;request=GetLegendGraphic&amp;sld_version=1.1.0&amp;layer=adminboundaries&amp;format=image/png&amp;STYLE=default"/>
          </LegendURL>
        </Style>
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>eez</Name>
        <Title>EEZ Boundaries</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-179.999</westBoundLongitude>
            <eastBoundLongitude>179.999</eastBoundLongitude>
            <southBoundLatitude>-85.4703</southBoundLatitude>
            <northBoundLatitude>87.0239</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-85.4703" miny="-179.999" maxx="87.0239" maxy="179.999" />
        <Style>
          <Name>default</Name>
          <Title>default</Title>
          <LegendURL width="53" height="21">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?version=1.3.0&amp;service=WMS&amp;request=GetLegendGraphic&amp;sld_version=1.1.0&amp;layer=eez&amp;format=image/png&amp;STYLE=default"/>
          </LegendURL>
        </Style>
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>cities</Name>
        <Title>Cities</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-176.152</westBoundLongitude>
            <eastBoundLongitude>179.222</eastBoundLongitude>
            <southBoundLatitude>-54.792</southBoundLatitude>
            <northBoundLatitude>78.2</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-54.792" miny="-176.152" maxx="78.2" maxy="179.222" />
        <Style>
          <Name>default</Name>
          <Title>default</Title>
          <LegendURL width="71" height="21">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?version=1.3.0&amp;service=WMS&amp;request=GetLegendGraphic&amp;sld_version=1.1.0&amp;layer=cities&amp;format=image/png&amp;STYLE=default"/>
          </LegendURL>
        </Style>
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>citieslabeled</Name>
        <Title>Cities With Labels</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-176.152</westBoundLongitude>
            <eastBoundLongitude>179.222</eastBoundLongitude>
            <southBoundLatitude>-54.792</southBoundLatitude>
            <northBoundLatitude>78.2</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-54.792" miny="-176.152" maxx="78.2" maxy="179.222" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>land</Name>
        <Title>Land Sea Mask</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-90</southBoundLatitude>
            <northBoundLatitude>83.6236</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-90" miny="-180" maxx="83.6236" maxy="180" />
        <Style>
          <Name>default</Name>
          <Title>default</Title>
          <LegendURL width="59" height="21">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?version=1.3.0&amp;service=WMS&amp;request=GetLegendGraphic&amp;sld_version=1.1.0&amp;layer=land&amp;format=image/png&amp;STYLE=default"/>
          </LegendURL>
        </Style>
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>LandSeaMask</Name>
        <Title>LandSeaMask</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-90</southBoundLatitude>
            <northBoundLatitude>90</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-90" miny="-180" maxx="90" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>Rivers</Name>
        <Title>Rivers</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-164.887</westBoundLongitude>
            <eastBoundLongitude>160.764</eastBoundLongitude>
            <southBoundLatitude>-36.9694</southBoundLatitude>
            <northBoundLatitude>71.3925</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-36.9694" miny="-164.887" maxx="71.3925" maxy="160.764" />
        <Style>
          <Name>default</Name>
          <Title>default</Title>
          <LegendURL width="71" height="21">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapserver.ngdc.noaa.gov/cgi-bin/public/gcv4/?version=1.3.0&amp;service=WMS&amp;request=GetLegendGraphic&amp;sld_version=1.1.0&amp;layer=Rivers&amp;format=image/png&amp;STYLE=default"/>
          </LegendURL>
        </Style>
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101992.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F101992.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101992.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F101992.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101992.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F101992.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101992.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F101992.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101993.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F101993.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101993.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F101993.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101993.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F101993.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101993.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F101993.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101994.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F101994.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101994.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F101994.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101994.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F101994.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F101994.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F101994.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121994.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F121994.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121994.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F121994.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121994.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F121994.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121994.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F121994.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121995.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F121995.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121995.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F121995.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121995.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F121995.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121995.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F121995.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121996.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F121996.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121996.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F121996.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121996.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F121996.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121996.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F121996.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121997.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F121997.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121997.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F121997.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121997.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F121997.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121997.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F121997.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121998.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F121998.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121998.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F121998.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121998.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F121998.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121998.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F121998.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121999.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F121999.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121999.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F121999.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121999.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F121999.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F121999.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F121999.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141997.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F141997.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141997.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F141997.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141997.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F141997.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141997.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F141997.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141998.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F141998.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141998.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F141998.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141998.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F141998.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141998.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F141998.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141999.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F141999.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141999.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F141999.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141999.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F141999.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F141999.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F141999.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142000.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F142000.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142000.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F142000.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142000.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F142000.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142000.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F142000.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142001.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F142001.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142001.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F142001.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142001.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F142001.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142001.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F142001.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142002.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F142002.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142002.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F142002.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142002.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F142002.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142002.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F142002.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142003.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F142003.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142003.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F142003.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142003.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F142003.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F142003.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F142003.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152000.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152000.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152000.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152000.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152000.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152000.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152000.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152000.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152001.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152001.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152001.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152001.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152001.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152001.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152001.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152001.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152002.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152002.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152002.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152002.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152002.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152002.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152002.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152002.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152003.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152003.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152003.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152003.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152003.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152003.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152003.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152003.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152004.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152004.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152004.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152004.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152004.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152004.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152004.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152004.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152005.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152005.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152005.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152005.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152005.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152005.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152005.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152005.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152006.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152006.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152006.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152006.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152006.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152006.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152006.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152006.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152007.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152007.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152007.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152007.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152007.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152007.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152007.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152007.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152008.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F152008.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152008.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F152008.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152008.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F152008.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F152008.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F152008.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162004.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F162004.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162004.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F162004.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162004.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F162004.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162004.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F162004.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162005.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F162005.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162005.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F162005.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162005.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F162005.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162005.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F162005.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162006.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F162006.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162006.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F162006.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162006.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F162006.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162006.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F162006.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162007.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F162007.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162007.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F162007.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162007.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F162007.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162007.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F162007.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162008.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F162008.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162008.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F162008.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162008.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F162008.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162008.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F162008.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162009.v4b.avg_lights_x_pct.lzw.tif</Name>
        <Title>F162009.v4b.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162009.v4b_web.avg_vis.lzw.tif</Name>
        <Title>F162009.v4b_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162009.v4b_web.cf_cvg.lzw.tif</Name>
        <Title>F162009.v4b_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F162009.v4b_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F162009.v4b_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F182010.v4c.avg_lights_x_pct.lzw.tif</Name>
        <Title>F182010.v4c.avg_lights_x_pct.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F182010.v4c_web.avg_vis.lzw.tif</Name>
        <Title>F182010.v4c_web.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F182010.v4c_web.cf_cvg.lzw.tif</Name>
        <Title>F182010.v4c_web.cf_cvg.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
    <Layer queryable="0" opaque="0" cascaded="0">
        <Name>F182010.v4c_web.stable_lights.avg_vis.lzw.tif</Name>
        <Title>F182010.v4c_web.stable_lights.avg_vis.lzw.tif</Title>
        <CRS>EPSG:4326</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-180</westBoundLongitude>
            <eastBoundLongitude>180</eastBoundLongitude>
            <southBoundLatitude>-65</southBoundLatitude>
            <northBoundLatitude>75</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="-65" miny="-180" maxx="75" maxy="180" />
    </Layer>
  </Layer>
</Capability>
</WMS_Capabilities>
*/
