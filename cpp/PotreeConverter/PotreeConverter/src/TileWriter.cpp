#include <cmath>
#include <fstream>
#include <TileWriter.h>
#include <experimental/filesystem>
#include <rapidjson/document.h>
#include <rapidjson/stringbuffer.h>
#include <rapidjson/prettywriter.h>

namespace Tile3D{
using rapidjson::Document;
using rapidjson::StringBuffer;
using rapidjson::Writer;
using rapidjson::Value;
using rapidjson::kObjectType;

using std::ofstream;
namespace fs = std::experimental::filesystem;

void appendData(vector<char>& dest, uint32_t value) {
    string str(reinterpret_cast<char*>(&value), sizeof(uint32_t));
    dest.insert(dest.end(), str.begin(), str.end());
}

void appendData(vector<char>& dest, double value) {
    float newValue = static_cast<float>(value);
    string str(reinterpret_cast<char*>(&newValue), sizeof(float));
    dest.insert(dest.end(), str.begin(), str.end());
}

TileWriter::TileWriter(const string& filepath)
: filepath_(filepath), hasColor_(false){
}

void TileWriter::verifyData(const vector<Point>& points) {
    for(auto& point : points) {
        if(point.color.x != 0 || point.color.y != 0 || point.color.z != 0) {
            hasColor_ = true;
        }
    }
}

void TileWriter::write(const vector<char>& data) {
    ofstream stream(filepath_, std::ios::out | std::ios::binary);
    stream.write(data.data(), data.size());
    stream.close();
}

vector<char> TileWriter::serializePositions(const vector<Point>& points){
    vector<char> positions;
    for(auto& point : points) {
        appendData(positions, point.position.x);
        appendData(positions, point.position.y);
        appendData(positions, point.position.z);
    }
    return positions;
}

vector<char> TileWriter::serializeColors(const vector<Point>& points) {
    vector<char> colors;
    if(hasColor_) {
        for(auto& point : points) {
            colors.push_back(point.color.x);
            colors.push_back(point.color.y);
            colors.push_back(point.color.z);
        }
    }
    return colors;
}

string TileWriter::serializeFeatureTableHeader(int pointSize, int positionBytes) {
    Document doc(kObjectType);
    doc.AddMember("POINTS_LENGTH", pointSize, doc.GetAllocator());
    Value position(kObjectType);
    position.AddMember("byteOffset", 0, doc.GetAllocator());
    doc.AddMember("POSITION", position, doc.GetAllocator());

    if(hasColor_) {
        Value rgb(kObjectType);
        rgb.AddMember("byteOffset", positionBytes, doc.GetAllocator());
        doc.AddMember("RGB", rgb, doc.GetAllocator());
    }

    StringBuffer buffer;
    Writer<StringBuffer> writer(buffer);
    doc.Accept(writer);
    return buffer.GetString();
}

bool TileWriter::write(const vector<Point>& points) {
    if(filepath_.empty()) {
        return false;
    }

    if(fs::exists(filepath_)){
        fs::remove(filepath_);
    }

    verifyData(points);

    vector<char> data;
    string magic("pnts");
    data.insert(data.end(), magic.begin(), magic.end());

    uint32_t version = 1;
    appendData(data, version);

    auto positionData = serializePositions(points);
    auto colorData = serializeColors(points);
    auto featureTableHeader = serializeFeatureTableHeader(static_cast<int>(points.size()), static_cast<int>(positionData.size()));

    const size_t tileHeaderBytes = 28;
    const size_t alignmentBytes = 4;

    featureTableHeader.append(std::ceil(static_cast<double>(featureTableHeader.size()) / alignmentBytes) * alignmentBytes - featureTableHeader.size(), ' ');
    const uint32_t alignedTotalBytes = static_cast<uint32_t>(tileHeaderBytes + featureTableHeader.size() + positionData.size() + colorData.size());

    appendData(data, alignedTotalBytes);

    uint32_t featureTableJsonByteLength = static_cast<uint32_t>(featureTableHeader.size());
    appendData(data, featureTableJsonByteLength);

    uint32_t featureTableByteBinaryLength = static_cast<uint32_t>(positionData.size() + colorData.size());
    appendData(data, featureTableByteBinaryLength);

    uint32_t batchTableByteLength = 0;
    appendData(data, batchTableByteLength);
    appendData(data, batchTableByteLength);

    data.insert(data.end(), featureTableHeader.begin(), featureTableHeader.end());
    data.insert(data.end(), positionData.begin(), positionData.end());
    data.insert(data.end(), colorData.begin(), colorData.end());

    write(data);
    return true;
}
}
