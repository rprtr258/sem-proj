#ifndef GRENADEGUN_H
#define GRENADEGUN_H

#include "weapon.h"
#include "grenade.h"

class GrenadeGun : public Weapon {
    public:
        void shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map) override;
};

#endif // GRENADEGUN_H
