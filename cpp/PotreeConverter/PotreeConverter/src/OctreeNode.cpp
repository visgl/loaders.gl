#include <OctreeNode.h>
#include <string>

namespace Tile3D{
OctreeNode::OctreeNode(int level, string id)
: level_(level), id_(id){
}

OctreeNode::OctreeNode(int level, string id, string filepath)
: level_(level), id_(id), filepath_(filepath){
}

bool OctreeNode::add(unique_ptr<OctreeNode>& node) {
    bool ret = false;
    if(node == NULL) {
        ret = true;
    }
    else if(node->level_ == level_ + 1 && node->id_.substr(0, node->id_.size() - 1) == id_){
        children_.push_back(std::move(node));
        ret = true;
    }
    else {
        for(auto& child : children_) {
            if(child->add(node)){
                ret = true;
                break;
            }
        }
    }
    return ret;
}
}
