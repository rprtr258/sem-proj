#ifndef RECTANGLE_H
#define RECTANGLE_H


class Rectangle {
    public:
        Rectangle();

        void moveHorizontal(const int &dx);

    public:
        int left, right, top, bottom;
};

#endif // RECTANGLE_H
