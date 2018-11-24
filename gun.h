#ifndef GUN_H
#define GUN_H

#include "weapon.h"
#include "bullet.h"

class Gun : public Weapon {
    public:
        Bullet* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map &map) override;
};

#endif // GUN_H
