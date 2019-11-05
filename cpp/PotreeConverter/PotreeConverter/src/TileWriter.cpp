#include <cmath>
#include <fstream>
#include <TileWriter.h>
#include <experimental/filesystem>
#include <rapidjson/document.h>
#include <rapidjson/stringbuffer.h>
#include <rapidjson/prettywriter.h>

#include <draco/point_cloud/point_cloud_builder.h>
#include <draco/compression/encode.h>

namespace Tile3D{
using rapidjson::Document;
using rapidjson::StringBuffer;
using rapidjson::Writer;
using rapidjson::Value;
using rapidjson::kObjectType;
using draco::PointCloud;
using draco::PointCloudBuilder;
using draco::Encoder;
using draco::EncoderBuffer;

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

TileWriter::TileWriter(const string& filepath, const TileConfig& config)
: filepath_(filepath), hasColor_(false), binarySize_(0), config_(config){
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

string TileWriter::serializeFeatureTableHeader(int pointSize) {
    Document doc(kObjectType);
    doc.AddMember("POINTS_LENGTH", pointSize, doc.GetAllocator());
    Value position(kObjectType);
    position.AddMember("byteOffset", 0, doc.GetAllocator());
    doc.AddMember("POSITION", position, doc.GetAllocator());

    if(hasColor_) {
        int positionBytes = config_.useDraco ? 0 : positionData_.size();
        Value rgb(kObjectType);
        rgb.AddMember("byteOffset", positionBytes, doc.GetAllocator());
        doc.AddMember("RGB", rgb, doc.GetAllocator());
    }

    if(config_.useDraco) {
        Value properties(kObjectType);
        properties.AddMember("POSITION", posAttId_, doc.GetAllocator());
        if(hasColor_) {
            properties.AddMember("RGB", colorAttId_, doc.GetAllocator());
        }
        Value compression(kObjectType);
        compression.AddMember("properties", properties, doc.GetAllocator());
        compression.AddMember("byteOffset", 0, doc.GetAllocator());
        compression.AddMember("byteLength", static_cast<int>(binarySize_), doc.GetAllocator());
        Value extensions(kObjectType);
        extensions.AddMember("3DTILES_draco_point_compression", compression, doc.GetAllocator());
        doc.AddMember("extensions", extensions, doc.GetAllocator());
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
    
    binarySize_ = 0;

    if(config_.useDraco) {
        binaryData_ = createDracoBinaryData(points);
        binarySize_ = binaryData_.size();
    }
    else {
        positionData_ = serializePositions(points);
        colorData_ = serializeColors(points);
        binarySize_ = positionData_.size() + colorData_.size();
    }

    auto featureTableHeader = serializeFeatureTableHeader(static_cast<int>(points.size()));
    const size_t tileHeaderBytes = 28;
    const size_t alignmentBytes = 4;

    featureTableHeader.append(std::ceil(static_cast<double>(featureTableHeader.size()) / alignmentBytes) * alignmentBytes - featureTableHeader.size(), ' ');
    const uint32_t alignedTotalBytes = static_cast<uint32_t>(tileHeaderBytes + featureTableHeader.size() + binarySize_);

    appendData(data, alignedTotalBytes);

    uint32_t featureTableJsonByteLength = static_cast<uint32_t>(featureTableHeader.size());
    appendData(data, featureTableJsonByteLength);

    uint32_t featureTableByteBinaryLength = static_cast<uint32_t>(binarySize_);
    appendData(data, featureTableByteBinaryLength);

    uint32_t batchTableByteLength = 0;
    appendData(data, batchTableByteLength);
    appendData(data, batchTableByteLength);

    data.insert(data.end(), featureTableHeader.begin(), featureTableHeader.end());
    
    if(config_.useDraco) {
        data.insert(data.end(), binaryData_.begin(), binaryData_.end());
    }
    else {
        data.insert(data.end(), positionData_.begin(), positionData_.end());
        data.insert(data.end(), colorData_.begin(), colorData_.end());
    }

    write(data);
    return true;
}

std::unique_ptr<PointCloud> TileWriter::createDracoPointCloud(const vector<Point>& points) {
    PointCloudBuilder pc_builder;

    const int kNumPoints = points.size();
    pc_builder.Start(kNumPoints);

    // Add one position attribute and two generic attributes.
    posAttId_ = pc_builder.AddAttribute(draco::GeometryAttribute::POSITION, 3, draco::DT_FLOAT32);
    if(hasColor_) {
        colorAttId_ = pc_builder.AddAttribute(draco::GeometryAttribute::COLOR, 3, draco::DT_UINT8);
    }
  // Initialize the attribute values.
  for (draco::PointIndex i(0); i < kNumPoints; ++i) {
      auto& point = points[i.value()];
      pc_builder.SetAttributeValueForPoint(posAttId_, i, draco::Vector3f(point.position.x, point.position.y, point.position.z).data());
      if(hasColor_) {
          pc_builder.SetAttributeValueForPoint(colorAttId_, i, vector<unsigned char>({point.color.x, point.color.y, point.color.z}).data());
      }
  }

  return pc_builder.Finalize(false);
}
vector<char> TileWriter::createDracoBinaryData(const vector<Point>& points) {
    Encoder encoder;
    encoder.SetAttributeQuantization(draco::GeometryAttribute::POSITION, config_.positionBits);
    encoder.SetAttributeQuantization(draco::GeometryAttribute::COLOR, config_.colorBits);
    EncoderBuffer buffer;
    auto pointCloud = createDracoPointCloud(points);
    const draco::Status status = encoder.EncodePointCloudToBuffer(*pointCloud, &buffer);
    if(!status.ok()) {
        std::cout << filepath_ + " failed on draco compression!" << std::endl;
    }
    return std::move(*buffer.buffer());
}
}
