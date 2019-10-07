#ifndef PTXPOINTREADER_H
#define PTXPOINTREADER_H

#include <map>
#include "PointReader.h"

using std::string;
using std::fstream;
using std::vector;

namespace Potree{

/**
* This reader importa PTX files. We suppose that PTX files are a concatenation,
* of multiple PTX "chunks", all of them having the same structure. Every point
* has exactly 4 double precision fields: X, Y, Z, Intensity (from 0.0 to 1.0).
*/
class PTXPointReader : public PointReader {
private:
    double tr[16];
    Point p;
    long currentChunk;
    static std::map<string, AABB> aabbs;
    static std::map<string, long> counts;

    inline Point transform(double tr[16], double x, double y, double z) const {
        Point p(tr[0] * x + tr[4] * y + tr[8] * z + tr[12],
                tr[1] * x + tr[5] * y + tr[9] * z + tr[13],
                tr[2] * x + tr[6] * y + tr[10] * z + tr[14]);
        return p;
    }

    fstream *stream;
    string path;
    vector<string> files;
    vector<string>::iterator currentFile;
    Vector3<double> origin;

    /**
    * Returns false if there is neo next chunk.
    */
    bool loadChunk(fstream *stream, long currentChunk, double tr[16]);

    void scanForAABB();

    bool doReadNextPoint();

public:

    PTXPointReader(string path);

    ~PTXPointReader() {
        close();
    }

    bool readNextPoint();

    inline Point getPoint() {
        return p;
    }

    inline Vector3<double> getOrigin() {
        return origin;
    }

    inline AABB getAABB() {
        if (PTXPointReader::aabbs.find(path) == aabbs.end()) {
            scanForAABB();
        }
        return PTXPointReader::aabbs[path];
    }

    inline long long numPoints() {
        if (PTXPointReader::counts.find(path) == counts.end()) {
            scanForAABB();
        }
        return PTXPointReader::counts[path];
    }

    inline void close() {
        stream->close();
    }
};

}

#endif