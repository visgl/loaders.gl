

#ifndef LASPOINTREADER_H
#define LASPOINTREADER_H

#include <string>
#include <iostream>
#include <vector>

#include "laszip_api.h"

#include "Point.h"
#include "PointReader.h"
#include "stuff.h"

using std::string;

using std::ifstream;
using std::cout;
using std::endl;
using std::vector;

namespace Potree{

class LIBLASReader{
private:

    double tr[16];
    bool hasTransform = false;

    Point transform(double x, double y, double z) const {
        Point p;
        if (hasTransform) {
            p.position.x = tr[0] * x + tr[4] * y + tr[8] * z + tr[12];
            p.position.y = tr[1] * x + tr[5] * y + tr[9] * z + tr[13];
            p.position.z = tr[2] * x + tr[6] * y + tr[10] * z + tr[14];
        } else {
			p.position = Vector3<double>{x,y,z};
        }
        return p;
    }
public:

	laszip_POINTER laszip_reader;
	laszip_header* header;
	laszip_point* point;
	int colorScale;
	double coordinates[3];
	long long pointsRead = 0;

    LIBLASReader(string path) {

		laszip_create(&laszip_reader);

		laszip_BOOL request_reader = 1;
		laszip_request_compatibility_mode(laszip_reader, request_reader);

		{// read first x points to find if color is 1 or 2 bytes
			laszip_BOOL is_compressed = iEndsWith(path, ".laz") ? 1 : 0;
			laszip_open_reader(laszip_reader, path.c_str(), &is_compressed);

			laszip_get_header_pointer(laszip_reader, &header);

			long long npoints = (header->number_of_point_records ? header->number_of_point_records : header->extended_number_of_point_records);
			
			laszip_get_point_pointer(laszip_reader, &point);

			colorScale = 1;
			for(int i = 0; i < 100000 && i < npoints; i++){
				laszip_read_point(laszip_reader);
		
				auto r = point->rgb[0];
				auto g = point->rgb[1];
				auto b = point->rgb[2];
		
				if(r > 255 || g > 255 || b > 255){
					colorScale = 256;
					break;
				};
			}
		}

		laszip_seek_point(laszip_reader, 0);
    }

	long long numPoints() {
		if (header->version_major >= 1 && header->version_minor >= 4) {
			return header->extended_number_of_point_records;
		} else {
			return header->number_of_point_records;
		}
	}

	~LIBLASReader(){
		laszip_close_reader(laszip_reader);
		laszip_destroy(laszip_reader);
	}

	bool readPoint(){
		if(pointsRead < numPoints()){
			laszip_read_point(laszip_reader);
			pointsRead++;

			return true;
		}else{
			return false;
		}
	}

    Point GetPoint() {
        
		laszip_get_coordinates(laszip_reader, coordinates);

        Point p = transform(coordinates[0], coordinates[1], coordinates[2]);
        p.intensity = point->intensity;
        p.classification = point->classification;

        p.color.x = point->rgb[0] / colorScale;
        p.color.y = point->rgb[1] / colorScale;
        p.color.z = point->rgb[2] / colorScale;

		p.returnNumber = point->return_number;
		p.numberOfReturns = point->number_of_returns;
		p.pointSourceID = point->point_source_ID;
		p.gpsTime = point->gps_time;

        return p;
    }
	void close(){

	}

	AABB getAABB();
};


class LASPointReader : public PointReader{
private:
	AABB aabb;
	string path;
	LIBLASReader *reader;
	vector<string> files;
	vector<string>::iterator currentFile;
public:

	LASPointReader(string path);

	~LASPointReader();

	bool readNextPoint();

	Point getPoint();

	AABB getAABB();

	long long numPoints();

	void close();

	Vector3<double> getScale();
};

}

#endif
