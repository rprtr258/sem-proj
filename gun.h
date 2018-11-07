#ifndef GUN_H
#define GUN_H

#include "weapon.h"
#include "bullet.h"

class Gun : public Weapon {
    public:
        virtual ~Gun();
        virtual Bullet* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map &map) {
            QQuickItem *bulletItem = view->createBullet((qint32)playerCoord.x(), (qint32)playerCoord.y());
            Bullet *bullet = new Bullet(bulletItem, mouseCoord - playerCoord, map);
            return bullet;
        }
    };

#endif // GUN_H
