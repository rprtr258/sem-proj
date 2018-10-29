#include "bullet.h"

Bullet::Bullet(QQuickItem *item) : m_item(item) {
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
    m_direction.setX(10);
}

Bullet::~Bullet() {
    delete m_item;
}

void Bullet::update() {
    m_position += m_direction;
    m_item->setPosition(m_position.toPointF());
}
