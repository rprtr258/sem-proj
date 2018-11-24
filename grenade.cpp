#include <QRect>
#include <QtMath>
#include "grenade.h"

Grenade::Grenade(QQuickItem *item, QVector2D mouseCoord, QVector2D playerCoord, Map *worldMap) : m_item(item), m_map(worldMap) {
    m_position = QVector2D(m_item->position());
    float hSpeed = (mouseCoord.x() - playerCoord.x()) / 17;
    float vSpeed = (mouseCoord.y() - playerCoord.y()) / 12;
    m_speed = QVector2D(hSpeed, vSpeed);
}

Grenade::~Grenade() {
    m_item->deleteLater();
}

bool Grenade::update() {
    m_speed += QVector2D(0, 1);
    m_position += m_speed;
    m_item->setPosition(m_position.toPointF());

    QRect m_boundingBox = QRect(m_position.toPoint().x(), m_position.toPoint().y(), 1, 1);
    return (m_position.x() < 0 or m_position.x() > 640 or
            m_position.y() < 0 or m_position.y() > 480 or
            m_map->isFilled(m_boundingBox));
}

qint32 Grenade::getDamage() {
    return damage;
}

qint32 Grenade::getMana() {
    return mana;
}
