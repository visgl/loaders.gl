

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