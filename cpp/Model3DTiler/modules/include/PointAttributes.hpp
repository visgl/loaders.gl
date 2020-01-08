/*
Copyright (c) 2011-2014, Markus Schütz
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of the FreeBSD Project.
*/

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
