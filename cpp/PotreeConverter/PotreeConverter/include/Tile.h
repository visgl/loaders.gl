#ifndef TILE_H
#define TILE_H


#include <memory>
#include <vector>
#include <string>
#include <OctreeNode.h>
#include <LASPointReader.h>
#include <Point.h>

#include <rapidjson/document.h>

namespace Tile3D{

using std::vector;
using std::unique_ptr;
using std::string;

using Potree::LIBLASReader;
using Potree::Point;

using rapidjson::Document;
using rapidjson::Value;

class Tile{
public:
    Tile(const OctreeNode& node);
    void writeData(const string& path);
    Value toJson(Document& doc);
    bool isValid() {
        return points_.size() > 3;
    }

private:
    void createBbox();
    void readData();
    void readPoints();

private:
    int level_;
    string id_;
    string filepath_;
    unique_ptr<LIBLASReader> reader_;
    vector<double> bbox_;
    vector<Point> points_;
    double geometricError_;
};
}

#endif
