#include <QRect>
#include <QtMath>
#include "grenade.h"

const qreal EPS = 1e-10;

Grenade::Grenade(QQuickItem *item, QVector2D mouseCoord, QVector2D playerCoord, Map &worldMap) : m_item(item) {
    m_position.setX(m_item->x());
    m_position.setY(m_item->y());
    m_map = &worldMap;
    m_mouseCoord = mouseCoord;
    m_playerCoord = playerCoord;
}

Grenade::~Grenade() {
    m_item->deleteLater();
}

float parabolaValue(float x, float a, float b, float c) {
    return x * x * a + b * x + c;
}

qint32 t = 0;

//a * x^2 + b * x + c = y(x)
bool Grenade::update() {
    qint32 x0 = m_mouseCoord.x();
    qint32 y0 = m_mouseCoord.y();
    // x0 == x1 !!!

    qreal dx = m_playerCoord.x() - m_mouseCoord.x(); // x1 - x0
    qreal dy = m_playerCoord.y() - m_mouseCoord.y(); // y1 - y0
    qreal a = 0.0;
    qreal b = 0.0;
    qreal c = 0.0;
    qreal coefficient = 0.0;

    if (dy > 0) {
        if (abs(dx) < EPS) {
            m_position.setY(m_position.y() - t * 5 + t * t * 1);
            t += 1;
        } else {
            a = dy / (dx * dx);
            b = -2 * (dy * m_mouseCoord.x()) / (dx * dx);
            c = m_mouseCoord.y() - a * m_mouseCoord.x() * m_mouseCoord.x() - b * m_mouseCoord.x();
            coefficient = 1 / sqrt(1 + pow((2 * a * m_playerCoord.x() + b), 2));
        }
    } else {
        a = -dy / (dx * dx);
        b = (2 * dy * m_playerCoord.x()) / (dx * dx);
        c = m_mouseCoord.y() - a * m_mouseCoord.x() * m_mouseCoord.x() - b * m_mouseCoord.x();
        coefficient = 1 / sqrt(1 + pow((2 * a * m_mouseCoord.x() + b), 2));
    }

    if (abs(dx) > EPS) {
        m_position.setX(m_position.x() - 10 * coefficient * dx / abs(dx));
        m_position.setY(parabolaValue(m_position.x(), a, b, c));
    }

    m_item->setPosition(m_position.toPointF());

    QRect m_boundingBox = QRect(m_position.x(), m_position.y(), 1, 1);
    return (not (m_position.x() >= 0 and m_position.x() < 640 and
                (m_position.y() >=0 and m_position.y() < 480))) or
                (m_map->isFilled(m_boundingBox));
}

qint32 Grenade::getDamage() {
    return damage;
}

qint32 Grenade::getMana() {
    return mana;
}

