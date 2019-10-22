#ifndef TILE_3D_CONVERTER_H
#define TILE_3D_CONVERTER_H

#include <string>
#include <vector>
#include <memory>
#include <rapidjson/document.h>
#include <experimental/filesystem>
#include <OctreeNode.h>

namespace Tile3D{
namespace fs = std::experimental::filesystem;

using std::string;
using std::vector;
using std::unique_ptr;
using rapidjson::Document;
using rapidjson::Value;
using fs::path;

class Tile3DConverter{

public:
    Tile3DConverter(string dataDir, string workDir, vector<double>& transform);
    void convert();
    void readJsonHeader();
    void collectPotreeFiles();
    void buildOctree();
    void processOctree();

private:
    void traverseOctree(const OctreeNode& node, Value& value);
private:
    string dataDir_;
    string workDir_;
    Document cloudJsonDoc_;
    Document tilesetJsonDoc_;
    vector<path> filePaths_;
    unique_ptr<OctreeNode> rootNode_;
    vector<double> transform_;
};

}

#endif
