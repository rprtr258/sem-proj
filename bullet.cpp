#include <QRect>
#include "character.h"
#include "bullet.h"

Bullet::Bullet(QQuickItem *item, QVector2D direction, Map *map, qint32 damage, qint32 ownerId) : Projectile(item, map, damage, ownerId) {
    m_direction = direction.normalized() * 10;
    m_position = QVector2D(m_item->position());
}

Bullet::~Bullet() {
    m_item->deleteLater();
}

void Bullet::affect(Character *character) {
    if (character->getId() == m_ownerId)
        return;
    QRectF boundingBox = character->getBoundingBox();
    if (boundingBox.contains(m_item->position())) {
        character->hit(m_damage);
        m_hit = true;
    }
}

bool Bullet::update() {
    if (m_hit)
        return true;
    m_position += m_direction;
    m_item->setPosition(m_position.toPoint());

    QRect m_boundingBox = QRect(m_position.toPoint().x(), m_position.toPoint().y(), 1, 1);
    return (m_position.x() < -200 or m_position.x() > 640 + 200 or
            m_position.y() < -200 or m_position.y() > 480 + 200 or
            m_map->isFilled(m_boundingBox));
}
