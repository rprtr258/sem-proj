#include <QRect>
#include <QtMath>
#include "character.h"
#include "grenade.h"

Grenade::Grenade(QQuickItem *item, QVector2D direction, Map *map, qint32 damage, qint32 ownerId) : Projectile(item, map, damage, ownerId) {
    m_position = QVector2D(m_item->position());
    float hSpeed = direction.x() / 17;
    float vSpeed = direction.y() / 12;
    m_speed = QVector2D(hSpeed, vSpeed);
}

Grenade::~Grenade() {
    m_item->deleteLater();
}

void Grenade::affect(Character *character) {
    if (character->getId() == m_ownerId)
        return;
    if (m_readyToDie) {
        QVector2D characterPos(character->getBoundingBox().center());
        qint32 dist = qint32(m_position.distanceToPoint(characterPos));
        character->hit(dist * m_damage / 100);
    }
}

bool Grenade::update() {
    m_speed += QVector2D(0, 1);
    m_position += m_speed;

    QRect m_boundingBox = QRect(m_position.toPoint().x(), m_position.toPoint().y(), 1, 1);
    if ((m_position.x() < -200 or m_position.x() > 640 + 200 or
        m_position.y() < -200 or m_position.y() > 480 + 200 or
        m_map->isFilled(m_boundingBox)) and (not m_readyToDie)) {
        m_readyToDie = true;
        m_speed = QVector2D(0, 0);
        return false;
    }
    if (not m_readyToDie)
        m_item->setPosition(m_position.toPointF());
    return m_readyToDie;
}
