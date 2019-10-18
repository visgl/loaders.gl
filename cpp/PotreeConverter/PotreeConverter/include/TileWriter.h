#ifndef TILE_WRITER_H
#define TILE_WRITER_H

#include <vector>
#include <string>
#include <Point.h>

namespace Tile3D{

using std::vector;
using std::string;
using Potree::Point;

class TileWriter{
public:
    TileWriter(const string& filepath);
    bool write(const vector<Point>& points);

private:
    void write(const vector<char>& data);
    vector<char> serializePositions(const vector<Point>& points);
    vector<char> serializeColors(const vector<Point>& points);
    string serializeFeatureTableHeader(int pointSize, int positionBytes);
    void verifyData(const vector<Point>& points);

private:
    string filepath_;
    bool hasColor_;
};
}

#endif
