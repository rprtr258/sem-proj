#include "character.h"
#include "laser.h"

Laser::Laser(QQuickItem *item, QVector2D position, QVector2D direction, qint32 damage, qint32 ownerId) : Projectile(item, nullptr, damage, ownerId), m_direction(direction), m_position(position) {
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

float crossProduct(QVector2D a, QVector2D b) {
    return a.x() * b.y() - a.y() * b.x();
}

bool Laser::doesIntersect(QPoint b1, QPoint b2) {
    QVector2D a1(b1);
    QVector2D a2(b2);
    float val1 = crossProduct(m_direction, a1 - m_position);
    float val2 = crossProduct(m_direction, a2 - m_position);
    if (val1 * val2 > 0)
        return false;
    val1 = crossProduct(a2 - a1, m_position - a1);
    val2 = crossProduct(a2 - a1, m_position + m_direction - a1);
    //qDebug() << "second" << val1 << val2;
    if (val1 * val2 > 0)
        return false;
    return true;
}
