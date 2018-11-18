#ifndef LASERGUN_H
#define LASERGUN_H

#include "weapon.h"
#include "laser.h"

class LaserGun : public Weapon {
    public:
        virtual ~LaserGun();

        virtual Laser* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map &map) {

            QQuickItem *laserItem = view->createLaser(getTail(mouseCoord, playerCoord, map), playerCoord);
            Laser *laser = new Laser(laserItem, mouseCoord - playerCoord);
            return laser;
        }
    private:
        QVector2D getTail(QVector2D mouseCoord, QVector2D playerCoord, Map &map) {
            QVector2D diection = mouseCoord - playerCoord;
            diection = diection / diection.length() * 10;
            QVector2D position = playerCoord;
            QRect rect = QRect(position.x(), position.y(), 1, 1);

            qint32 topScreenX = 630;
            qint32 bottomScreenX = 5;
            qint32 topScreenY = 470;
            qint32 bottomScreenY = 0;

            while ((!map.isFilled(rect)) && isInScreen(position, topScreenX, bottomScreenX, topScreenY, bottomScreenY)) {
                position.setX(position.x() + diection.x());
                position.setY(position.y() + diection.y());
                rect.translate(diection.x(), diection.y());
            }
            return position;
        }

        bool isInScreen(QVector2D point, qint32 topScreenX, qint32 bottomScreenX, qint32 topScreenY, qint32 bottomScreenY) {
                return point.x() >= bottomScreenX && point.x() <= topScreenX &&
                       point.y() >= bottomScreenY && point.y() <= topScreenY;
        }
    };

#endif // LASERGUN_H
