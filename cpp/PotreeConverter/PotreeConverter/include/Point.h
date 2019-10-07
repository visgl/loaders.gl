
#ifndef POINT_H
#define POINT_H

#include "Vector3.h"

#include <iostream>

using std::ostream;

namespace Potree{

class Point{
public:

	Vector3<double> position{0};
	Vector3<unsigned char> color{255};
	Vector3<float> normal{0};
	unsigned short intensity = 0;
	unsigned char classification = 0;
	unsigned char returnNumber = 0;
	unsigned char numberOfReturns = 0;
	unsigned short pointSourceID = 0;
	double gpsTime = 0.0;


	Point() = default;

	Point(double x, double y, double z) :
		position(x, y, z)
	{

	}

	Point(double x, double y, double z, unsigned char r, unsigned char g, unsigned char b) :
		position(x, y, z), color(r, g, b)
	{

	}

	Point(const Point &other) = default;

	~Point() = default;

	friend ostream &operator<<( ostream &output,  const Point &value ){ 
		output << value.position ;
		return output;            
	}

};

}

#endif
