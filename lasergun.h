#ifndef LASERGUN_H
#define LASERGUN_H

#include "weapon.h"
#include "laser.h"

class LaserGun : public Weapon {
    public:
        Laser* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map) override;
    private:
        QVector2D calcEndPoint(QVector2D mouseCoord, QVector2D playerCoord, Map *map);
        bool isInScreen(QVector2D point);
    private:
        qint32 const damage = 10;
        qint32 const mana = 10;
};

#endif // LASERGUN_H
