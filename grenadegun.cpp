#include "grenadegun.h"

void GrenadeGun::shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map) {
    QQuickItem *grenadeItem = view->createGrenade(playerCoord.toPoint().x(), playerCoord.toPoint().y());
    Grenade *grenade = new Grenade(grenadeItem, mouseCoord, playerCoord, map);
    view->addCreature(grenade);
}
