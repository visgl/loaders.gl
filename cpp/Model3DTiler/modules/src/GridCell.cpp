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

#include "GridCell.h"
#include "SparseGrid.h"

#include <iostream>

using std::cout;
using std::endl;

using std::min;
using std::max;

namespace Potree{

#define MAX_FLOAT std::numeric_limits<float>::max()

GridCell::GridCell(){

}

GridCell::GridCell(SparseGrid *grid, GridIndex &index){
	this->grid = grid;
    neighbours.reserve(26);

	for(int i = max(index.i -1, 0); i <= min(grid->width-1, index.i + 1); i++){
		for(int j = max(index.j -1, 0); j <= min(grid->height-1, index.j + 1); j++){
			for(int k = max(index.k -1, 0); k <= min(grid->depth-1, index.k + 1); k++){

				long long key = ((long long)k << 40) | ((long long)j << 20) | i;
				SparseGrid::iterator it = grid->find(key);
				if(it != grid->end()){
					GridCell *neighbour = it->second;
					if(neighbour != this){
						neighbours.push_back(neighbour);
						neighbour->neighbours.push_back(this);
					}
				}

			}
		}
	}
}

void GridCell::add(Vector3<double> p){
	points.push_back(p);
}

bool GridCell::isDistant(const Vector3<double> &p, const double &squaredSpacing) const {
	for(const Vector3<double> &point : points){
		
		if(p.squaredDistanceTo(point) < squaredSpacing){
			return false;
		}

	}

	return true;
}

}
