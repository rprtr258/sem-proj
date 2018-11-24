#include "grenadegun.h"

Grenade* GrenadeGun::shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map) {
    QQuickItem *grenadeItem = view->createGrenade(playerCoord.toPoint().x(), playerCoord.toPoint().y());
    return new Grenade(grenadeItem, mouseCoord, playerCoord, map);
}
