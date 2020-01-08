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

#ifndef GRID_INDEX_H
#define GRID_INDEX_H

namespace Potree{

class GridIndex{
public:
	int i,j,k;

	GridIndex(){
		i = 0;
		j = 0;
		k = 0;
	}

	GridIndex(int i, int j, int k){
		this->i = i;
		this->j = j;
		this->k = k;
	}

	bool operator<(const GridIndex& b) const{
		if(i < b.i){
			return true;
		}else if(i == b.i && j < b.j){
			return true;
		}else if(i == b.i && j == b.j && k < b.k){
			return true;
		}

		return false;
	}

	friend ostream &operator<<( ostream &output,  const GridIndex &value ){ 
		output << "[" << value.i << ", " << value.j << ", " << value.k << "]" ;
		return output;            
	}

};

}

#endif
