#ifndef LASERGUN_H
#define LASERGUN_H

#include "weapon.h"
#include "laser.h"

class LaserGun : public Weapon {
    public:
        void shoot(Bridge *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map, qint32 ownerId) override;
    private:
        QVector2D calcEndPoint(QVector2D mouseCoord, QVector2D playerCoord, Map *map);
        bool isInScreen(QVector2D point);
};

#endif // LASERGUN_H
