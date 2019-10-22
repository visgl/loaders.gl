#ifndef OCTREE_NODE_H
#define OCTREE_NODE_H

#include <memory>
#include <vector>
#include <string>

namespace Tile3D{

using std::vector;
using std::unique_ptr;
using std::string;

class OctreeNode{
public:
    OctreeNode(int level, string id);
    OctreeNode(int level, string id, string filepath_);

    int level() const {
        return level_;
    }

    const string& id() const {
        return id_;
    }

    const string& filepath() const {
        return filepath_;
    }

    const vector<unique_ptr<OctreeNode>>& children() const {
        return children_;
    }

    bool add(unique_ptr<OctreeNode>& node);

private:
    int level_;
    string id_;
    string filepath_;
    vector<unique_ptr<OctreeNode>> children_;
};
}

#endif
