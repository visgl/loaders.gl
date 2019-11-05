#ifndef TILE_CONFIG_H
#define TILE_CONFIG_H

namespace Tile3D{

struct TileConfig{
    TileConfig(bool useDraco_ = false, int positionBits_ = 14, int colorBits_ = 8)
    : useDraco(useDraco_), positionBits(positionBits_), colorBits(colorBits_) {
    }
    
    bool useDraco;
    int positionBits;
    int colorBits;
};
}

#endif
