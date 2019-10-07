#ifndef XYZPOINTREADER_H
#define XYZPOINTREADER_H

#include "Point.h"
#include "PointReader.h"
#include "PotreeException.h"

#include <string>
#include <fstream>
#include <iostream>
#include <regex>
#include <vector>
#include <sstream>
#include <algorithm>

using std::getline;
using std::ifstream;
using std::string;
using std::vector;
using std::cout;
using std::endl;
using std::stringstream;

namespace Potree{

class XYZPointReader : public PointReader{
private:
	AABB aabb;
	ifstream stream;
	long pointsRead;
	long pointCount;
	char *buffer;
	int pointByteSize;
	Point point;
	string format;

	float colorOffset;
	float colorScale;

	float intensityOffset;
	float intensityScale;

	int linesSkipped;

public:
	XYZPointReader(string file, string format, vector<double> colorRange, vector<double> intensityRange)
	: stream(file, std::ios::in | std::ios::binary)
	{
		this->format = format;
		pointsRead = 0;
		linesSkipped = 0;
		pointCount = 0;
		colorScale = -1;

		if(intensityRange.size() == 2){
			intensityOffset = (float)intensityRange[0];
			intensityScale = (float)intensityRange[1]-(float)intensityRange[0];
		}else if(intensityRange.size() == 1){
			intensityOffset = 0.0f;
			intensityScale = (float)intensityRange[0];
		}else{
			intensityOffset = 0.0f;
			intensityScale = 1.0f;
		}

		if(colorRange.size() == 2){
			colorOffset = (float)colorRange[0];
			colorScale = (float)colorRange[1];
		}else if(colorRange.size() == 1){
			colorOffset = 0.0f;
			colorScale = (float)colorRange[0];
		}else if(colorRange.size() == 0){
			colorOffset = 0.0f;

			// try to find color range by evaluating the first x points.
			float max = 0;
			int j = 0; 
			string line;
			while(getline(stream, line) && j < 1000){
				trim(line);
				vector<string> tokens = split(line, { '\t', ' ', ',' });

				if(this->format == "" && tokens.size() >= 3){
					string f(tokens.size(), 's');
					f.replace(0, 3, "xyz");

					if(tokens.size() >= 6){
						f.replace(tokens.size() - 3, 3, "rgb");
					}

					this->format = f;
					cout << "using format: '" << this->format << "'" << endl;
				}

				if(tokens.size() < this->format.size()){
					continue;
				}

				int i = 0;
				for(const auto &f : format) {
					string token = tokens[i++];
					if(f == 'r'){
						max = std::max(max, stof(token));
					}else if(f == 'g'){
						max = std::max(max, stof(token));
					}else if(f == 'b'){
						max = std::max(max, stof(token));
					}
				}

				

				j++;
			}

			if(max <= 1.0f){
				colorScale = 1.0f;
			} else if(max <= 255){
				colorScale = 255.0f;
			}else if(max <= pow(2, 16) - 1){
				colorScale =(float)pow(2, 16) - 1;
			}else{
				colorScale = (float)max;
			}

			stream.clear();
			stream.seekg(0, stream.beg);

		}

		// read through once to calculate aabb and number of points
		while(readNextPoint()){
			Point p = getPoint();
			aabb.update(p.position);
			pointCount++;
		}
		stream.clear();
		stream.seekg(0, stream.beg);
	}

	bool readNextPoint(){
		double x = 0;
		double y = 0;
		double z = 0;
		float nx = 0;
		float ny = 0;
		float nz = 0;
		unsigned char r = 255;
		unsigned char g = 255;
		unsigned char b = 255;
		// unsigned char a = 255;  // unused variable
		unsigned short intensity = 0;

		string line;
		while(getline(stream, line)){
			trim(line);
			vector<string> tokens = split(line, {'\t', ' ', ','});
			if(tokens.size() != format.size()){
				//throw PotreeException("Not enough tokens for the given format");

				if(linesSkipped == 0){
					cout << "some lines may be skipped because they do not match the given format: '" << format << "'" << endl;
				}

				linesSkipped++;
				continue;
			}

			int i = 0;
			for(const auto &f : format) {
				string token = tokens[i++];
				if(f == 'x'){
					x = stod(token);
				}else if(f == 'y'){
					y = stod(token);
				}else if(f == 'z'){
					z = stod(token);
				}else if(f == 'r'){
					r = (unsigned char)(255.0f * (stof(token) - colorOffset) / colorScale); 
				}else if(f == 'g'){
					g = (unsigned char)(255.0f * (stof(token) - colorOffset) / colorScale); 
				}else if(f == 'b'){
					b = (unsigned char)(255.0f * (stof(token) - colorOffset) / colorScale); 
				}else if(f == 'i'){
					intensity = (unsigned short)( 65535 * (stof(token) - intensityOffset) / intensityScale);
				}else if(f == 's'){
					// skip
				}else if(f == 'X'){
					nx = stof(token);
				}else if(f == 'Y'){
					ny = stof(token);
				}else if(f == 'Z'){
					nz = stof(token);
				}
			}

			point = Point(x,y,z,r,g,b);
			point.normal.x = nx;
			point.normal.y = ny;
			point.normal.z = nz;
			point.intensity = intensity;
			pointsRead++;
			return true;
		}

		return false;
	}

	Point getPoint(){
		return point;
	}

	AABB getAABB(){
		return aabb;
	}
	long long numPoints(){
		return pointCount;
	}
	void close(){
		stream.close();
	}
};

}

#endif
