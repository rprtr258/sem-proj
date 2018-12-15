#include <QRandomGenerator>

#include "bot.h"

bool isInPlayerBoundingBox(QPoint playerCoord, QVector2D point) {
    return point.x() >= playerCoord.x() && point.x() <= playerCoord.x() + 55 &&
           point.y() >= playerCoord.y() && point.y() <= playerCoord.y() + 95;
}

Bot::Bot(Map *map, Observer *view, QQuickItem *item, QPoint pos) : Character (map, view, item, pos) {}

bool Bot::isHeroVisible() {
    QVector2D playerCoord = QVector2D(m_map->getMarkedPoint("player")) + QVector2D(27, 47);
    QVector2D position = QVector2D(getHandPosition());
    QVector2D direction = (playerCoord - position).normalized();

    while (not m_map->isFilled(position.toPoint())) {
        position += direction;
        if (isInPlayerBoundingBox(m_map->getMarkedPoint("player"), position)) {
            return true;
        }
    }
    return false;
}

bool Bot::canAttack() {
    return isHeroVisible() && (m_mana >= m_weapon->getManaCost()) && (m_reload == 0);
}

bool Bot::update() {
    switch (state) {
        case Attack: {
            qDebug() << "Attack";
            if (canAttack()) // attack player if can
                attack(m_map->getMarkedPoint("player").x() + 27, m_map->getMarkedPoint("player").y() + 40);
            else
                state = Walk;
            // chase player
            if (m_map->getMarkedPoint("player").x() <= m_coord.x()) {
                stopRight();
                goLeft();
            } else {
                stopLeft();
                goRight();
            }
            if (m_mana < m_weapon->getManaCost())
                state = Flee;
            break;
        }

        case Flee: {
            qDebug() << "Flee";
            if (m_mana >= 3 * m_weapon->getManaCost()) {
                state = Attack;
            } else {
                if (m_map->getMarkedPoint("player").x() >= m_coord.x()) {
                    stopRight();
                    goLeft();
                } else {
                    stopLeft();
                    goRight();
                }
                if (m_goingLeft && m_map->isFilled(m_boundingBox.translated(-5, 0))) {
                    state = Stand;
                }
                if (m_goingRight && m_map->isFilled(m_boundingBox.translated(5, 0))) {
                    state = Stand;
                }
            }
            break;
        }

        case Walk: {
            qDebug() << "Walk";
            if (canAttack()) {
                state = Attack;
            } else {
                QRandomGenerator qrg;
                if (m_map->isFilled(m_boundingBox.translated(-1, 0)) and m_goingLeft) {
                    stopLeft();
                    goRight();
                } else if (m_map->isFilled(m_boundingBox.translated(1, 0)) and m_goingRight) {
                    stopRight();
                    goLeft();
                } else if (qrg.generate() % 70 == 0){
                    if (m_goingLeft) {
                        stopLeft();
                        goRight();
                    } else if (m_goingRight) {
                        stopRight();
                        goLeft();
                    }
                }
                if (m_goingLeft && m_map->isFilled(m_boundingBox.translated(-5, 0))) {
                    state = Stand;
                }
                if (m_goingRight && m_map->isFilled(m_boundingBox.translated(5, 0))) {
                    state = Stand;
                }
            }
            break;
        }

        case Stand: {
            qDebug() << "Stand";
            stopLeft();
            stopRight();
            if (canAttack() and m_mana >= 3 * m_weapon->getManaCost()) {
                state = Attack;
            }
        }
    }
    return Character::update();
}
