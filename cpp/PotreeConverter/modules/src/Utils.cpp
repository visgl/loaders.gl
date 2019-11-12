#include <Utils.h>
#include <cmath>

namespace UTILS{
double a = 6378137.0;
double b = 6356752.3142;
double f = (a - b) / a;
double e_sq = f * (2.0-f);

double Utils::radians(double degree) {
    return degree * M_PI / 180.0;
}

std::vector<double> Utils::enuToEcefMatrix(double latitude, double longitude, double height) {
    double lamb = radians(latitude);
    double phi = radians(longitude);
    double s = sin(lamb);
    double n = a / sqrt(1.0 - e_sq * s * s);

    double sin_lambda = sin(lamb);
    double cos_lambda = cos(lamb);
    double sin_phi = sin(phi);
    double cos_phi = cos(phi);

    double x = (height + n) * cos_lambda * cos_phi;
    double y = (height + n) * cos_lambda * sin_phi;
    double z = (height + (1.0 - e_sq) * n) * sin_lambda;

    return vector<double>({-sin_phi, cos_phi, 0.0, 0.0, -cos_phi * sin_lambda, -sin_lambda * sin_phi, cos_lambda, 0.0, cos_lambda * cos_phi, cos_lambda * sin_phi, sin_lambda, 0.0, x, y, z, 1.0});
}
}
