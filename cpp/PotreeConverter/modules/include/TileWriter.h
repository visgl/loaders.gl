#ifndef TILE_WRITER_H
#define TILE_WRITER_H

#include <vector>
#include <string>
#include <Point.h>
#include <draco/point_cloud/point_cloud.h>
#include <TileConfig.h>

namespace Tile3D{

using std::vector;
using std::string;
using Potree::Point;
using draco::PointCloud;

class TileWriter{
public:
    TileWriter(const string& filepath, const TileConfig& config);
    bool write(const vector<Point>& points);

private:
    void write(const vector<char>& data);
    vector<char> serializePositions(const vector<Point>& points);
    vector<char> serializeColors(const vector<Point>& points);
    string serializeFeatureTableHeader(int pointSize);
    void verifyData(const vector<Point>& points);
    std::unique_ptr<PointCloud> createDracoPointCloud(const vector<Point>& points);
    vector<char> createDracoBinaryData(const vector<Point>& points);

private:
    string filepath_;
    bool hasColor_;
    size_t binarySize_;
    int32_t posAttId_;
    int32_t colorAttId_;
    vector<char> binaryData_;
    vector<char> positionData_;
    vector<char> colorData_;
    TileConfig config_;
};
}

#endif
