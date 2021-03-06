#ifndef GRENADEGUN_H
#define GRENADEGUN_H

#include "weapon.h"
#include "grenade.h"

class GrenadeGun : public Weapon {
    public:
        GrenadeGun();
        void shoot(Bridge *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map, qint32 ownerId) override;
};

#endif // GRENADEGUN_H
