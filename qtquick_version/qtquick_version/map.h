#ifndef MAP_H
#define MAP_H

#include <QRect>
#include <QVector>

class Map {
    public:
        Map();
        bool isFilled(const qint32 &x, const qint32 &y) const;
        bool isFilled(const QRect &r) const;
        void fillRectangle(qint32 x1, qint32 y1, qint32 x2, qint32 y2);
    private:
        QVector<QRect> m_rects;
};

#endif // MAP_H
