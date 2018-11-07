#ifndef LASERGUN_H
#define LASERGUN_H

#include "weapon.h"
#include "laser.h"

class LaserGun : public Weapon {
    public:
        virtual ~LaserGun();
        virtual Laser* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord) {
            QQuickItem *laserItem = view->createLaser((qint32)playerCoord.x(), (qint32)playerCoord.y());
            Laser *laser = new Laser(laserItem, mouseCoord - playerCoord);
            return laser;
        }
    };

#endif // LASERGUN_H
