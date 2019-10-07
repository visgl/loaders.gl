
#ifndef BINPOINTWRITER_H
#define BINPOINTWRITER_H

#include <string>
#include <vector>
#include <iostream>
#include <fstream>

#include "AABB.h"
#include "PointAttributes.hpp"
#include "PointWriter.hpp"
#include "stuff.h"


using std::string;
using std::vector;
using std::ofstream;
using std::ios;

namespace Potree{

class BINPointWriter : public PointWriter{

public:
	PointAttributes attributes;
	ofstream *writer;
	AABB aabb;
	double scale;

	BINPointWriter(string file, AABB aabb, double scale, PointAttributes pointAttributes) {
		this->file = file;
		this->aabb = aabb;
		this->scale = scale;
		numPoints = 0;

		attributes = pointAttributes;

		writer = new ofstream(file, ios::out | ios::binary);
	}

	BINPointWriter(string file, PointAttributes attributes) {
		this->file = file;
		numPoints = 0;
		this->attributes = attributes;

		writer = new ofstream(file, ios::out | ios::binary);
	}

	~BINPointWriter(){
		close();
	}

	void write(const Point &point){
		for(int i = 0; i < attributes.size(); i++){

			PointAttribute attribute = attributes[i];

			if(attribute == PointAttribute::POSITION_CARTESIAN){
				//float pos[3] = {(float) point.x,(float)  point.y,(float)  point.z};
				int x = (int)((point.position.x - aabb.min.x) / scale);
				int y = (int)((point.position.y - aabb.min.y) / scale);
				int z = (int)((point.position.z - aabb.min.z) / scale);
				int pos[3] = {x, y, z};
				writer->write((const char*)pos, 3*sizeof(int));
			}else if(attribute == PointAttribute::COLOR_PACKED){
				unsigned char rgba[4] = {point.color.x, point.color.y, point.color.z, 255};
				writer->write((const char*)rgba, 4*sizeof(unsigned char));
			}else if(attribute == PointAttribute::INTENSITY){
				writer->write((const char*)&point.intensity, sizeof(unsigned short));
			}else if(attribute == PointAttribute::CLASSIFICATION){
				writer->write((const char*)&point.classification, sizeof(unsigned char));
			} else if (attribute == PointAttribute::RETURN_NUMBER) {
				writer->write((const char*)&point.returnNumber, sizeof(unsigned char));
			} else if (attribute == PointAttribute::NUMBER_OF_RETURNS) {
				writer->write((const char*)&point.numberOfReturns, sizeof(unsigned char));
			} else if (attribute == PointAttribute::SOURCE_ID) {
				writer->write((const char*)&point.pointSourceID, sizeof(unsigned short));
			} else if (attribute == PointAttribute::GPS_TIME) {
				writer->write((const char*)&point.gpsTime, sizeof(double));
			} else if(attribute == PointAttribute::NORMAL_SPHEREMAPPED){
				// see http://aras-p.info/texts/CompactNormalStorage.html
				float nx = point.normal.x;
				float ny = point.normal.y;
				float nz = point.normal.z;
				float lengthxy = sqrt(nx * nx + ny * ny);

				float ex = 0.5f * (nx / lengthxy) * sqrt(-nz * 0.5f + 0.5f) + 0.5f;
				float ey = 0.5f * (ny / lengthxy) * sqrt(-nz * 0.5f + 0.5f) + 0.5f;

				unsigned char bx = (unsigned char)(ex * 255);
				unsigned char by = (unsigned char)(ey * 255);

				writer->write((const char*)&bx, 1);
				writer->write((const char*)&by, 1);
			}else if(attribute == PointAttribute::NORMAL_OCT16){
				// see http://lgdv.cs.fau.de/get/1602

				float nx = point.normal.x;
				float ny = point.normal.y;
				float nz = point.normal.z;
				
				float norm1 = abs(nx) + abs(ny) + abs(nz);

				nx = nx / norm1;
				ny = ny / norm1;
				nz = nz / norm1;

				float u = 0;
				float v = 0;

				if(nz >= 0){
					u = nx;
					v = ny;
				}else{
					u = psign(nx)*(1-psign(ny)*ny);
					v = psign(ny)*(1-psign(nx)*nx);
				}

				unsigned char bx = (unsigned char)(min((u + 1) * 128, 255.0f));
				unsigned char by = (unsigned char)(min((v + 1) * 128, 255.0f));

				writer->write((const char*)&bx, 1);
				writer->write((const char*)&by, 1);
			}else if(attribute == PointAttribute::NORMAL){
				writer->write((const char*)&point.normal.x, sizeof(float));
				writer->write((const char*)&point.normal.y, sizeof(float));
				writer->write((const char*)&point.normal.z, sizeof(float));
			}
		}

		numPoints++;
	}

	void close(){
		if(writer != NULL){
			writer->close();
			delete writer;
			writer = NULL;
		}
	}

};

}

#endif


