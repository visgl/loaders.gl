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

#ifndef AABB_H
#define AABB_H


#include <math.h>
#include <algorithm>

#include "Vector3.h"

using std::min;
using std::max;
using std::endl;

namespace Potree{

class AABB{

public:
	Vector3<double> min;
	Vector3<double> max;
	Vector3<double> size;

	AABB(){
		min = Vector3<double>(std::numeric_limits<float>::max());
		max = Vector3<double>(-std::numeric_limits<float>::max());
		size = Vector3<double>(std::numeric_limits<float>::max());
	}

	AABB(Vector3<double> min, Vector3<double> max){
		this->min = min;
		this->max = max;
		size = max-min;
	}

	bool isInside(const Vector3<double> &p){
		if(min.x <= p.x && p.x <= max.x){
			if(min.y <= p.y && p.y <= max.y){
				if(min.z <= p.z && p.z <= max.z){
					return true;
				}
			}
		}

		return false;
	}

	void update(const Vector3<double> &point){
		min.x = std::min(min.x, point.x);
		min.y = std::min(min.y, point.y);
		min.z = std::min(min.z, point.z);

		max.x = std::max(max.x, point.x);
		max.y = std::max(max.y, point.y);
		max.z = std::max(max.z, point.z);

		size = max - min;
	}

	void update(const AABB &aabb){
		update(aabb.min);
		update(aabb.max);
	}

	void makeCubic(){
		max = min + size.maxValue();
		size = max - min;
	}

	friend ostream &operator<<( ostream &output,  const AABB &value ){ 
		output << "min: " << value.min << endl;
		output << "max: " << value.max << endl;
		output << "size: " << value.size << endl;
		return output;            
	}

};

}

#endif
