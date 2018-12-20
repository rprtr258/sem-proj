#include "character.h"
#include "laser.h"

Laser::Laser(QQuickItem *item, QVector2D direction, qint32 damage, qint32 ownerId) : Projectile(item, nullptr, damage, ownerId), m_direction(direction) {
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
    m_lifetime = 20;
}

Laser::~Laser() {
    m_item->deleteLater();
}

void Laser::affect(Character *character) {
    if (character->getId() == m_ownerId or not m_active)
        return;
    QRect boundingBox = character->getBoundingBox();
    if (doesIntersect(boundingBox.topLeft(), boundingBox.topRight()) or
        doesIntersect(boundingBox.bottomRight(), boundingBox.topRight()) or
        doesIntersect(boundingBox.bottomRight(), boundingBox.bottomLeft()) or
        doesIntersect(boundingBox.topLeft(), boundingBox.bottomLeft())) {
        m_active = false;
        character->hit(m_damage);
    }
}

bool Laser::update() {
    m_lifetime--;
    return (m_lifetime == 0);
}
