

#ifndef POINT_ATTRIBUTES_H
#define POINT_ATTRIBUTES_H

#include <string>
#include <vector>

using std::string;
using std::vector;

namespace Potree{

class PointAttribute{
public:
	static const PointAttribute POSITION_CARTESIAN;
	static const PointAttribute COLOR_PACKED;
	static const PointAttribute INTENSITY;
	static const PointAttribute CLASSIFICATION;
	static const PointAttribute RETURN_NUMBER;
	static const PointAttribute NUMBER_OF_RETURNS;
	static const PointAttribute SOURCE_ID;
	static const PointAttribute GPS_TIME;
	static const PointAttribute NORMAL_SPHEREMAPPED;
	static const PointAttribute NORMAL_OCT16;
	static const PointAttribute NORMAL;

	int ordinal;
	string name;
	int numElements;
	int byteSize;

	PointAttribute(int ordinal, string name, int numElements, int byteSize){
		this->ordinal = ordinal;
		this->name = name;
		this->numElements = numElements;
		this->byteSize = byteSize;
	}

	static PointAttribute fromString(string name);

};

bool operator==(const PointAttribute& lhs, const PointAttribute& rhs);


class PointAttributes{
public:
	vector<PointAttribute> attributes;
	int byteSize;

	PointAttributes(){
		byteSize = 0;
	}

	void add(PointAttribute attribute){
		attributes.push_back(attribute);
		byteSize += attribute.byteSize;
	}

	int size(){
		return (int)attributes.size();
	}

	PointAttribute& operator[](int i) { 
		return attributes[i]; 
	}


};


}




#endif