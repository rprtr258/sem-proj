#ifndef LASERGUN_H
#define LASERGUN_H

#include "weapon.h"
#include "laser.h"

class LaserGun : public Weapon {
    public:
        ~LaserGun() override;

        Laser* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map &map) override;
    private:
        QVector2D getTail(QVector2D mouseCoord, QVector2D playerCoord, Map &map) {
            QVector2D direction = (mouseCoord - playerCoord).normalized();
            QVector2D position = playerCoord;
            while (!map.isFilled(position.toPoint()) and isInScreen(position))
                position += direction;
            return position;
        }

        bool isInScreen(QVector2D point) {
            const qint32 topScreenX = 640;
            const qint32 bottomScreenX = 0;
            const qint32 topScreenY = 480;
            const qint32 bottomScreenY = 0;
            return point.x() >= bottomScreenX && point.x() <= topScreenX &&
                   point.y() >= bottomScreenY && point.y() <= topScreenY;
        }
    };

#endif // LASERGUN_H
