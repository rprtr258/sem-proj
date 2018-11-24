#include "weapon.h"

Weapon::~Weapon() {}

QVector2D Weapon::getStartCoord(qint32 width, bool isFlip, QVector2D coord) {
    int const ofsetY = 40;
    int const ofsetX = 15;

    if (isFlip) {
        return QVector2D(coord.x() + width - ofsetX, coord.y() + ofsetY);
    }
    return QVector2D(coord.x() + ofsetX, coord.y() + ofsetY);
}
