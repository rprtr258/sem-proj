#ifndef GRENADEGUN_H
#define GRENADEGUN_H

#include "weapon.h"
#include "grenade.h"

class GrenadeGun : public Weapon {
    public:
        virtual ~GrenadeGun();
        virtual Grenade* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map &map) {
            QQuickItem *grenadeItem = view->createGrenade((qint32)playerCoord.x(), (qint32)playerCoord.y());
            Grenade *bullet = new Grenade(grenadeItem, mouseCoord, playerCoord, map);
            return bullet;
        }
    };

#endif // GRENADEGUN_H
