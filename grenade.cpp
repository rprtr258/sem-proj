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
    if (m_dieCounter == 17) {
        QVector2D characterPos(character->getBoundingBox().center());
        qreal dist = qint32(m_position.distanceToPoint(characterPos));
        qreal damage = pow(std::max(0.0, pow(200, 2) - pow(dist, 2)), 1.0 / 2) * m_damage / 100;
        character->hit(damage);
    }
}

bool Grenade::update() {
    m_speed += QVector2D(0, 1);
    m_position += m_speed;

    QRect m_boundingBox = QRect(m_position.toPoint().x(), m_position.toPoint().y(), 30, 30);
    if ((m_position.x() < -200 or m_position.x() > 640 + 200 or
        m_position.y() < -200 or m_position.y() > 480 + 200 or
        m_map->isFilled(m_boundingBox)) and m_dieCounter == -1) {
        m_position -= m_speed;
        m_speed /= 100.0;
        qint32 tries = 1000;
        float sz = 30;
        while (!m_map->isFilled(QRect(qint32(m_position.x() + 30 / 2 - sz / 2 + m_speed.x()), qint32(m_position.y() + 30 / 2 - sz / 2 + m_speed.y()), sz, sz))) {
            m_position += m_speed;
            tries--;
            if (tries == 0)
                break;
        }
        m_item->setPosition(m_position.toPointF());
        m_dieCounter = 18;
        m_speed = QVector2D(0, 0);m_item->setProperty("explosion", true);
        return false;
    }
    if (m_dieCounter == -1)
        m_item->setPosition(m_position.toPointF());
    else {
        m_dieCounter--;
    }
    return (m_dieCounter == 0);
}
