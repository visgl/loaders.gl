#include <iostream>
#include <Tile.h>
#include <TileWriter.h>
#include <AABB.h>
#include <rapidjson/prettywriter.h>


namespace Tile3D{
using rapidjson::Document;
using rapidjson::Value;
using rapidjson::kObjectType;
using rapidjson::kArrayType;

using Potree::AABB;

Tile::Tile(const OctreeNode& node)
: level_(node.level()), id_(node.id()), filepath_(node.filepath()), reader_(new LIBLASReader(filepath_)), geometricError_(0.0){
    readData();
}

void Tile::createBbox() {
    auto header = reader_->header;
    vector<double> zeros({0, 0, 0});
    bbox_.clear();

    AABB aabb;

    for(auto& point : points_) {
        aabb.update(point.position);
    }
    double maxHalfSize = max(max(aabb.size.x, aabb.size.y), aabb.size.z) / 2.0;
    bbox_.push_back((aabb.min.x + aabb.max.x) / 2.0);
    bbox_.push_back((aabb.min.y + aabb.max.y) / 2.0);
    bbox_.push_back((aabb.min.z + aabb.max.z) / 2.0);
    bbox_.push_back(maxHalfSize);
    bbox_.insert(bbox_.end(), zeros.begin(), zeros.end());
    bbox_.push_back(maxHalfSize);
    bbox_.insert(bbox_.end(), zeros.begin(), zeros.end());
    bbox_.push_back(maxHalfSize);

    geometricError_ = (header->max_x - header->min_x) / 115.47 * 8.0;
}

void Tile::readPoints() {
    while(reader_->readPoint()) {
        points_.push_back(reader_->GetPoint());
    }
}

void Tile::readData() {
    if(reader_ == nullptr || reader_->header == nullptr) {
        return;
    }
    readPoints();
    createBbox();
}

void Tile::writeData(const string& path) {
    string filePath = path + "/r" + id_ + ".pnts";
    TileWriter writer(filePath);
    writer.write(points_);
}

Value Tile::toJson(Document& doc){
    Value value(kObjectType);

    Value bbox(kArrayType);
    Value volume(kObjectType);
    for(auto& v : bbox_) {
        bbox.PushBack(v, doc.GetAllocator());
    }
    volume.AddMember("box", bbox, doc.GetAllocator());
    value.AddMember("boundingVolume", volume, doc.GetAllocator());

    Value children(kArrayType);
    value.AddMember("children", children, doc.GetAllocator());

    string str("r" + id_ + ".pnts");
    Value url;
    url.SetString(str.c_str(), 	static_cast<int>(str.size()), doc.GetAllocator());
    Value content(kObjectType);
    content.AddMember("url", url, doc.GetAllocator());
    value.AddMember("content", content, doc.GetAllocator());

    value.AddMember("geometricError", geometricError_, doc.GetAllocator());

    if(id_.empty()) {
        value.AddMember("refine", "ADD", doc.GetAllocator());
    }
    return value;
}
}
