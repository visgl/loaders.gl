#include <string>
#include <vector>
#include <fstream>
#include <memory>
#include <Tile3DConverter.h>
#include <Tile.h>
#include <rapidjson/prettywriter.h>
#include <rapidjson/stringbuffer.h>
#include <rapidjson/istreamwrapper.h>

using rapidjson::StringBuffer;
using rapidjson::Writer;
using rapidjson::PrettyWriter;
using rapidjson::Value;
using rapidjson::IStreamWrapper;
using rapidjson::kObjectType;
using std::fstream;
using std::unique_ptr;
using std::make_unique;

namespace Tile3D{

bool comparePath(const path& a, const path& b) {
    auto lengthA = a.filename().string().length();
    auto lengthB = b.filename().string().length();
    if(lengthA != lengthB) {
        return lengthA < lengthB;
    }
    return a.filename() < b.filename();
}

Tile3DConverter::Tile3DConverter(string dataDir, string workDir)
: dataDir_(dataDir), workDir_(workDir), tilesetJsonDoc_(kObjectType){
}

void Tile3DConverter::convert(){
    readJsonHeader();
    collectPotreeFiles();
    buildOctree();
    processOctree();
}

void Tile3DConverter::readJsonHeader() {
    std::ifstream ifs(dataDir_ + "/cloud.js");
    if ( !ifs.is_open() )
    {
        std::cerr << "Could not open cloud.js file for reading!\n";
        return;
    }

    IStreamWrapper isw(ifs);

    cloudJsonDoc_.ParseStream(isw);
    // std::cout << cloudJsonDoc_["version"].GetString() << std::endl;;
}

void Tile3DConverter::collectPotreeFiles() {
    for(auto& p: fs::recursive_directory_iterator(dataDir_)) {
        if(p.path().extension() == ".las") {
            filePaths_.push_back(p.path());
        }
    }

    sort(filePaths_.begin(), filePaths_.end(), comparePath);
}

void Tile3DConverter::buildOctree() {
    if(filePaths_.empty()) {
        return;
    }

    for(auto& path : filePaths_) {
        auto filename = path.filename().string();
        filename = filename.substr(1, filename.find_last_of('.') - 1);
        int level = static_cast<int>(filename.size());

        unique_ptr<OctreeNode> treeNode = make_unique<OctreeNode>(level, filename, path.string());
        if(filename.empty()) {
            rootNode_ = std::move(treeNode);
        }
        else {
            rootNode_->add(treeNode);
        }
    }
}

void Tile3DConverter::traverseOctree(const OctreeNode& node, Value& value) {
    Tile tile(node);
    Value json = tile.toJson(tilesetJsonDoc_);
    for(auto& p : node.children()) {
        traverseOctree(*p, json);
    }
    if(tile.isValid()) {
        tile.writeData("/Users/jianhuang/Uber/test_3d");
        if(node.id().empty()) {
            value["root"] = json;
        }
        else {
            value["children"].PushBack(json, tilesetJsonDoc_.GetAllocator());
        }
    }
}

void Tile3DConverter::processOctree() {
    auto& doc = tilesetJsonDoc_;
    Value asset(kObjectType);
    asset.AddMember("version", "0.0", doc.GetAllocator());
    doc.AddMember("asset", asset, doc.GetAllocator());
    doc.AddMember("geometricError", 0.0, doc.GetAllocator());
    doc.AddMember("root", Value(kObjectType), doc.GetAllocator());

    traverseOctree(*rootNode_, doc);
    doc["geometricError"] = doc["root"]["geometricError"].GetDouble();

    StringBuffer buffer;
    //PrettyWriter<StringBuffer> writer(buffer);
    Writer<StringBuffer> writer(buffer);
    doc.Accept(writer);
    string filepath("/Users/jianhuang/Uber/test_3d/tileset.json");
    if(fs::exists(filepath)){
        fs::remove(filepath);
    }

    ofstream stream(filepath, ios::out);
    stream << buffer.GetString();
    stream.close();
}
}
