#include "lasergun.h"

LaserGun::~LaserGun() {}

Laser* LaserGun::shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map &map) {
    QVector2D endPoint = getTail(mouseCoord, playerCoord, map);
    QQuickItem *laserItem = view->createLaser(endPoint, playerCoord);
    return new Laser(laserItem, endPoint - playerCoord);
}
