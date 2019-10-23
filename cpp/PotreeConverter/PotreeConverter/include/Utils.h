#ifndef UTILS_H
#define UTILS_H

#include <vector>

namespace UTILS{

using std::vector;

class Utils{
public:
    static double radians(double degree);
    static vector<double> enuToEcefMatrix(double latitude, double longitude, double height = 0.0);
};
}

#endif
